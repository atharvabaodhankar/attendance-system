import subprocess
import random
import sys
import os
from datetime import datetime, timedelta

# Configuration
START_DATE = "2026-03-08"
NUM_COMMITS = 41
BASE_COMMIT = "38a68d8" # Commit before the rewrite range

def run_command(cmd, env=None):
    """Run command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore', env=env)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def main():
    print("=== Manual Git Date Rewriter (Targeted) ===\n")
    
    # Verify git repo
    _, _, code = run_command("git rev-parse --git-dir")
    if code != 0:
        print("Error: Not a git repository")
        sys.exit(1)
    
    # Get current branch
    current_branch, _, _ = run_command("git rev-parse --abbrev-ref HEAD")
    print(f"Branch: {current_branch}")
    
    # Create backup
    backup = f"backup-before-rewrite-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    print(f"Creating backup: {backup}")
    run_command(f"git branch {backup}")
    
    # Generate dates
    start_dt = datetime.strptime(START_DATE, "%Y-%m-%d")
    commit_dates = []
    
    current_dt = start_dt
    commits_remaining = NUM_COMMITS
    
    while commits_remaining > 0:
        # 2 or 3 commits per day
        count = min(commits_remaining, random.randint(2, 3))
        for _ in range(count):
            h, m, s = random.randint(9, 18), random.randint(0, 59), random.randint(0, 59)
            commit_dates.append(current_dt.replace(hour=h, minute=m, second=s).strftime("%Y-%m-%d %H:%M:%S"))
        current_dt += timedelta(days=1)
        commits_remaining -= count

    print(f"Distribution planned: {len(commit_dates)} commits over {(current_dt - start_dt).days} days.")
    
    # Get commits to rewrite (oldest first)
    commits_raw, _, _ = run_command(f'git log {BASE_COMMIT}..HEAD --format="%H|||%an|||%ae|||%s" --reverse')
    
    if not commits_raw:
        print(f"Error: No commits found in range {BASE_COMMIT}..HEAD")
        sys.exit(1)
    
    commits = []
    for line in commits_raw.split('\n'):
        if '|||' in line:
            parts = line.split('|||')
            commits.append({
                'hash': parts[0],
                'author': parts[1],
                'email': parts[2],
                'message': '|||'.join(parts[3:])
            })
    
    if len(commits) != NUM_COMMITS:
        print(f"Warning: Expected {NUM_COMMITS} commits but found {len(commits)}")
    
    # Start rewrite
    temp_branch = f"temp-rewrite-{datetime.now().strftime('%H%M%S')}"
    print(f"\nRebuilding history from {BASE_COMMIT} on {temp_branch}...")
    
    # Create new branch starting FROM the base commit
    run_command(f"git checkout -b {temp_branch} {BASE_COMMIT}")
    
    # Process each commit
    for i, commit_info in enumerate(commits):
        new_date = commit_dates[i] if i < len(commit_dates) else commit_dates[-1]
        
        print(f"[{i+1}/{len(commits)}] {commit_info['hash'][:8]} -> {new_date}")
        
        # Match the state of the original commit
        # Use git rm -rf . to clear current state (excluding .git)
        # Then git checkout hash -- . to bring files from that commit
        run_command("git rm -rf .")
        run_command(f"git checkout {commit_info['hash']} -- .")
        run_command("git add -A")
        
        # Set environment variables
        env = os.environ.copy()
        env['GIT_AUTHOR_NAME'] = commit_info['author']
        env['GIT_AUTHOR_EMAIL'] = commit_info['email']
        env['GIT_AUTHOR_DATE'] = new_date
        env['GIT_COMMITTER_NAME'] = commit_info['author']
        env['GIT_COMMITTER_EMAIL'] = commit_info['email']
        env['GIT_COMMITTER_DATE'] = new_date
        
        # Commit
        message = commit_info['message'].replace('"', '\\"')
        commit_cmd = f'git commit -m "{message}"'
        subprocess.run(commit_cmd, shell=True, env=env, capture_output=True)
    
    # Finalize
    print(f"\nUpdating {current_branch}...")
    run_command(f"git branch -f {current_branch} {temp_branch}")
    run_command(f"git checkout {current_branch}")
    run_command(f"git branch -D {temp_branch}")
    
    print("\n✓ Rewrite complete!")
    print(f"To push: git push --force origin {current_branch}")
    print(f"To restore: git reset --hard {backup}\n")

if __name__ == "__main__":
    main()
