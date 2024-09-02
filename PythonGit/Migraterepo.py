import os
import subprocess
import shutil
import stat
from github import Github

# Use environment variables for tokens (more secure)
SOURCE_TOKEN ="src-token"
DEST_TOKEN = 'target-token'

# Ensure tokens are set
if not SOURCE_TOKEN or not DEST_TOKEN:
    raise ValueError("Please set SOURCE_GITHUB_TOKEN and DEST_GITHUB_TOKEN environment variables")

# Initialize GitHub objects for source and destination accounts
source_github = Github(SOURCE_TOKEN)
dest_github = Github(DEST_TOKEN)

# Replace with actual GitHub usernames
source_username = 'Senthamil2003'
dest_username = 'Senthamil20031'

# Fetch all repositories from the source account
source_user = source_github.get_user(source_username)
repos = source_user.get_repos()

# Directory to temporarily clone repositories
CLONE_DIR = 'cloned_repos'

# Create clone directory if it doesn't exist
if not os.path.exists(CLONE_DIR):
    os.makedirs(CLONE_DIR)

# List of repositories to move
repos_to_move = ["cyberadmin"]

# Function to handle permission errors
def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

# Iterate over each repository and copy it to the destination account
for repo in repos:
    try:
        repo_name = repo.name
        if repo_name in repos_to_move:
            clone_url = repo.clone_url
            print(f"Cloning repository: {repo_name}")

            # Clone the repository locally with --mirror to include all branches and tags
            clone_path = os.path.join(CLONE_DIR, repo_name)
            subprocess.run(['git', 'clone', '--mirror', clone_url, clone_path], check=True, stderr=subprocess.PIPE, universal_newlines=True)

            # Create a new repository in the destination account
            print(f"Creating new repository in destination account: {repo_name}")
            dest_user = dest_github.get_user()
            dest_repo = dest_user.create_repo(name=repo_name, private=repo.private)

            # Set the URL of the cloned repo to point to the new destination repository
            print(f"Pushing repository {repo_name} to destination account")
            push_url = f'https://{DEST_TOKEN}@github.com/{dest_username}/{repo_name}.git'
            
            # Push all branches and tags to the destination repository, excluding pull request refs
            try:
                subprocess.run(['git', '-C', clone_path, 'push', '--prune', '--all', push_url], check=True, stderr=subprocess.PIPE, universal_newlines=True)
                subprocess.run(['git', '-C', clone_path, 'push', '--prune', '--tags', push_url], check=True, stderr=subprocess.PIPE, universal_newlines=True)
                print(f"Repository {repo_name} copied successfully!")
            except subprocess.CalledProcessError as e:
                print(f"Failed to push repository {repo_name}: {e.stderr}")

        else:
            print(f"Skipped repository: {repo_name}")

    except Exception as e:
        print(f"Failed to process repository {repo.name}: {str(e)}")

# Clean up local cloned repositories
if os.path.exists(CLONE_DIR):
    shutil.rmtree(CLONE_DIR, onerror=remove_readonly)

print("All repositories have been processed, and temporary files have been cleaned up.")