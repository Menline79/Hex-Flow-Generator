

export const ORIGINAL_CODE = `
# ... (Input Reading)
for i in range(0, full, BLOCK_SIZE):
    block = data[i:i + BLOCK_SIZE]
    # CRITICAL PERFORMANCE ISSUE HERE:
    # Calling WriteFile for every 32 bytes creates massive system call overhead.
    # 770,000 lines/sec = 770,000 syscalls/sec.
    win32file.WriteFile(pipe_handle, (block.hex() + "\\n").encode())
`;

export const OPTIMIZED_CODE = `import os
import time
import binascii
import threading
from queue import Queue, Empty
from concurrent.futures import ThreadPoolExecutor
import win32pipe, win32file

ROOT = "H:/"
BLOCK_SIZE = 32
# Increase buffer to reduce read calls
BUFFER_SIZE = 1024 * 1024 * 16  # 16 MB
THREADS = 1
PIPE_NAME = r"\\\\.\\pipe\\hexpipe"

# --- PROGRESS SETTINGS ---
PROGRESS_FILE = "progress_log.txt"
SAVE_INTERVAL_SECONDS = 1800  # Auto-save every 30 minutes

def load_progress():
    """Loads list of processed files from log to enable resume."""
    processed = set()
    if os.path.exists(PROGRESS_FILE):
        print("Loading progress history...")
        try:
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    processed.add(line.strip())
        except Exception as e:
            print(f"Error loading progress: {e}")
    print(f"Resuming: {len(processed)} files already processed.")
    return processed

def create_pipe():
    pipe = win32pipe.CreateNamedPipe(
        PIPE_NAME,
        win32pipe.PIPE_ACCESS_OUTBOUND,
        win32pipe.PIPE_TYPE_BYTE | win32pipe.PIPE_WAIT,
        1,
        1024 * 1024, # 1MB Out buffer
        1024 * 1024, # 1MB In buffer
        0,
        None
    )
    print("Waiting for connection on:", PIPE_NAME)
    win32pipe.ConnectNamedPipe(pipe, None)
    print("Connected.")
    return pipe

def process_file(filepath, pipe_handle):
    try:
        f = open(filepath, "rb")
    except Exception:
        # Skip unreadable files (system files, permissions errors)
        return

    try:
        with f:
            leftover = b""
            
            while True:
                buf = f.read(BUFFER_SIZE)
                if not buf:
                    break

                data = leftover + buf
                total = len(data)
                blocks = total // BLOCK_SIZE
                full = blocks * BLOCK_SIZE

                output_chunks = []
                
                for i in range(0, full, BLOCK_SIZE):
                    chunk = data[i:i + BLOCK_SIZE]
                    output_chunks.append(binascii.hexlify(chunk))
                    output_chunks.append(b'\\n')

                if output_chunks:
                    win32file.WriteFile(pipe_handle, b"".join(output_chunks))

                leftover = data[full:]

            if leftover:
                win32file.WriteFile(pipe_handle, binascii.hexlify(leftover) + b"\\n")
    except Exception:
        # If a read fails midway (e.g. bad sector), skip the rest of the file
        pass

# Thread-safe queue for logging completed files to disk
done_file_queue = Queue()

def progress_saver_thread():
    """
    Background thread that batches writes to the progress log.
    Saves to disk every 30 minutes or upon exit.
    """
    buffer = []
    last_save_time = time.time()
    print("Progress saver started (Auto-save every 30 min).")
    
    while True:
        try:
            # Wait for a completed file path
            filepath = done_file_queue.get(timeout=1.0)
            
            # None is the "Stop" signal from main thread
            if filepath is None:
                break
                
            buffer.append(filepath)
        except Empty:
            pass # Continue to check time
            
        # Check if it is time to save (every 30 mins)
        current_time = time.time()
        if (current_time - last_save_time) >= SAVE_INTERVAL_SECONDS:
            if buffer:
                try:
                    with open(PROGRESS_FILE, "a", encoding="utf-8") as f:
                        for path in buffer:
                            f.write(path + "\\n")
                    print(f"[Auto-Save] Saved progress ({len(buffer)} new files).")
                    buffer = [] # Clear buffer
                    last_save_time = current_time
                except Exception as e:
                    print(f"Warning: Failed to save progress: {e}")

    # Final flush on exit
    if buffer:
        try:
            with open(PROGRESS_FILE, "a", encoding="utf-8") as f:
                for path in buffer:
                    f.write(path + "\\n")
            print("Final progress saved.")
        except Exception:
            pass

def worker(work_queue, pipe_handle):
    while True:
        try:
            filepath = work_queue.get_nowait()
        except Empty:
            return
        
        process_file(filepath, pipe_handle)
        
        # Mark as done regardless of success/failure so we don't retry broken files
        done_file_queue.put(filepath)
        work_queue.task_done()

if __name__ == "__main__":
    processed_files = load_progress()
    pipe = create_pipe()
    
    # Start the progress saver background thread
    saver = threading.Thread(target=progress_saver_thread)
    saver.daemon = True
    saver.start()

    q = Queue()
    print("Scanning files...")
    count = 0
    skipped = 0
    
    for root, dirs, files in os.walk(ROOT):
        for file in files:
            full_path = os.path.join(root, file)
            # SKIP files that were already processed in previous runs
            if full_path in processed_files:
                skipped += 1
                continue
            q.put(full_path)
            count += 1
            
    print(f"Queued {count} files. Skipped {skipped} already processed.")

    with ThreadPoolExecutor(max_workers=THREADS) as ex:
        for _ in range(THREADS):
            ex.submit(worker, q, pipe)

    # Signal saver to stop and wait for it to flush
    done_file_queue.put(None)
    saver.join()

    win32file.CloseHandle(pipe)
    print("Done.")
`;

export const EXPLANATION_TEXT = `
**Performance & Features:**
1. **Batching:** Writes 16MB chunks to the pipe, reducing system call overhead by 99.9%.
2. **Resume Capability:** 
   - Creates a \`progress_log.txt\` file.
   - On startup, checks this log and skips previously processed files.
   - **Auto-Save:** Saves progress to disk every 30 minutes (configurable via \`SAVE_INTERVAL_SECONDS\`) to prevent data loss during long runs.
3. **Robustness:** 
   - Uses \`try...except\` to silently skip system files or permission errors.
   - Ensures broken files are marked as "processed" so the script doesn't get stuck on them upon restart.

**Hardware Reality Check:**
5,000,000 lines/sec * ~65 bytes/line ≈ **325 MB/s**. 
A standard 7200RPM HDD typically reads at 120-160 MB/s. 
You will likely be limited by the physical speed of your HDD, not the Python script.
`;