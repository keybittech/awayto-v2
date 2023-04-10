import os
import re
import ast
import astor
import shutil
import json
from dockerfile_parse import DockerfileParser
from anytree import Node, RenderTree, AsciiStyle
from typing import List, Dict, Any
from collections import defaultdict
from enum import Enum

class EndpointType(Enum):
    MUTATION = "MUTATION"
    QUERY = "QUERY"

def list_files(startpath: str, ignore_dirs: List[str] = []) -> List[str]:
    file_list = []
    for root, dirs, files in os.walk(startpath):
        if any(ignored in root for ignored in ignore_dirs):
            continue
        for file in files:
            file_list.append(os.path.join(root, file))
    return file_list

def analyze_typescript(file_path: str, all_files: List[str]) -> None:
    with open(file_path, 'r') as f:
        content = f.read()
        api_definitions = re.findall(r'(\w+):\s*\{\s*kind:\s*EndpointType\.(\w+),', content)

        for api_name, api_type in api_definitions:
            hook_prefix = "useLazy" if EndpointType[api_type] == EndpointType.QUERY else "use"
            hook_name = f"{hook_prefix}{api_name[0].upper()}{api_name[1:]}{'Query' if EndpointType[api_type] == EndpointType.QUERY else 'Mutation'}"

            print(f"API Endpoint: {api_name} ({EndpointType[api_type]})")
            print(f"Searching for hook usage: {hook_name}")

            for search_file in all_files:
                if search_file.endswith(".ts") or search_file.endswith(".tsx"):
                    with open(search_file, 'r') as sf:
                        search_content = sf.read()
                        if hook_name in search_content:
                            print(f"  - {hook_name} used in {search_file}")

def read_gitignore(gitignore_path: str) -> List[str]:
    ignore_list = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f.readlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    ignore_list.append(line)
    return ignore_list

def extract_used_apis(file_path: str) -> List[str]:
    used_apis = []
    if file_path.endswith(".ts") or file_path.endswith(".tsx") or file_path.endswith(".js"):
        with open(file_path, 'r') as f:
            content = f.read()
            used_apis = re.findall(r'use(?:Lazy)?\w+(?:Query|Mutation)', content)
    return used_apis



def get_module_name(file_path: str) -> str:
    module_name = ""
    path_parts = []
    while True:
        file_path, tail = os.path.split(file_path)
        if tail:
            path_parts.insert(0, tail)
        else:
            break

    if "src" in path_parts:
        src_idx = path_parts.index("src")
        if len(path_parts) > src_idx + 1:
            module_name = path_parts[src_idx + 1]

    return module_name


def analyze_complexity(file_list: List[str]) -> Dict[str, Dict[str, Any]]:
    complexity_info = defaultdict(lambda: {
        'complexity': 0,
        'files': {},
    })

    def get_module_name_from_path(file_path: str) -> str:
        match = re.search(r'src/modules/(\w+)', file_path)
        return match.group(1).lower() if match else ""

    for file_path in file_list:
        if file_path.endswith(".ts") or file_path.endswith(".tsx") or file_path.endswith(".js"):
            module_name = get_module_name(file_path)
            used_apis = extract_used_apis(file_path)
            for api in used_apis:
                api_module = get_module_name_from_path(file_path)
                if api_module and api_module != module_name.lower():
                    complexity_info[api_module]['complexity'] += 1
                    if file_path not in complexity_info[api_module]['files']:
                        complexity_info[api_module]['files'][file_path] = []
                    complexity_info[api_module]['files'][file_path].append(api)

    return complexity_info



def build_file_tree(startpath: str, ignore_dirs: List[str] = []) -> Node:
    root = Node(os.path.basename(startpath), file_path=startpath)  # Add file_path attribute here
    allowed_extensions = ['.ts', '.tsx', '.js']

    def add_nodes(parent_node, parent_path):
        for item in os.listdir(parent_path):
            if any(ignored in item for ignored in ignore_dirs):
                continue

            item_path = os.path.join(parent_path, item)

            if os.path.isdir(item_path):
                new_node = Node(item, parent=parent_node, file_path=item_path)
                add_nodes(new_node, item_path)
            else:
                file_extension = os.path.splitext(item)[1]
                if file_extension in allowed_extensions:
                    used_apis = extract_used_apis(item_path)
                    if len(used_apis) > 0:
                        api_info = f" ({', '.join(used_apis)})"
                        node_name = f"{item}{api_info}"
                        Node(node_name, parent=parent_node, file_path=item_path, is_leaf=True)  # Explicitly set is_leaf=True

    add_nodes(root, startpath)
    return root


def distill_file_tree(root_node, output_folder="codegen", current_path=None):
    if current_path is None:
        current_path = output_folder
        
        # Create the output_folder if it doesn't exist
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
    
    for node in root_node.children:
        src_file_path = node.file_path

        if node.is_leaf and os.path.isfile(src_file_path):
            # If the node is a file, copy it to the output folder
            dst_file_path = os.path.join(current_path, os.path.basename(node.name.split(' ')[0]))
            shutil.copy(src_file_path, dst_file_path)
        elif os.path.isdir(src_file_path):
            # If the node is a directory, create a new folder and recurse
            new_path = os.path.join(current_path, node.name)
            if not os.path.exists(new_path):
                os.makedirs(new_path)
            distill_file_tree(node, output_folder, new_path)

def parse_file(file_content: str) -> dict:
    code_comments = re.findall(r'(/\*[\s\S]*?\*/)|//.*$', file_content, re.MULTILINE)
    cleaned_comments = [re.sub(r'(^/\*\s*|\s*\*/$|^//\s*)', '', comment).strip() for comment in code_comments]
    summarized_briefs = ' '.join(cleaned_comments).replace('\n', ' ')
    return {'text': summarized_briefs}
    
def remove_comments_and_empty_lines(content: str) -> str:
    content = re.sub(r'//.*', '', content)  # Remove single-line comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)  # Remove multi-line comments
    content = re.sub(r'^\s*$', '', content, flags=re.MULTILINE)  # Remove empty lines
    return content

def remove_import_statements(content: str) -> str:
    content = re.sub(r'^import .*?;$', '', content, flags=re.MULTILINE)
    return content

def remove_typing_information(content: str) -> str:
    content = re.sub(r':\s*[\w\[\],\s\?]+', '', content)
    return content


def process_files_recursive(node: Node) -> List[dict]:
    distilled_files = []

    if os.path.isfile(node.file_path):
        with open(node.file_path, 'r') as f:
            file_contents = f.read()
            file_contents = remove_comments_and_empty_lines(file_contents)
            file_contents = remove_import_statements(file_contents)
            file_contents = remove_typing_information(file_contents)
            summary = parse_file(file_contents)
            distilled_files.append({"prompt": f"Reconstruct the file {node.name.split(' ')[0]}", "summary": summary})

    for child in node.children:
        distilled_files.extend(process_files_recursive(child))

    return distilled_files

def create_manifest(file_tree: Node, output_path: str = "manifest.json") -> None:
    distilled_files = process_files_recursive(file_tree)

    with open(output_path, "w") as outfile:
        json.dump(distilled_files, outfile, indent=2)

if __name__ == "__main__":
    project_root = "."
    ignore_dirs = ["codegen", "node_modules", "landing", ".git", "themes"]
    gitignore_path = os.path.join(project_root, ".gitignore")
    ignore_dirs.extend(read_gitignore(gitignore_path))

    file_list = list_files(project_root, ignore_dirs)
    for file_path in file_list:
        if file_path.endswith(".ts"):
            analyze_typescript(file_path, file_list)

    file_tree = build_file_tree(project_root, ignore_dirs)
    for pre, _, node in RenderTree(file_tree, style=AsciiStyle()):
        print(f"{pre}{node.name}")

    distill_file_tree(file_tree)

    complexity_info = analyze_complexity(file_list)
    sorted_complexity_info = sorted(complexity_info.items(), key=lambda x: x[1]['complexity'], reverse=True)

    print("\nModules Complexity Ranking:")
    for module, info in sorted_complexity_info:
        print(f"{module}:")
        print(f"  Complexity: {info['complexity']}")
        print("  Files:")
        for file, apis in info['files'].items():
            print(f"    - {file}: {', '.join(apis)}")
        print()


    create_manifest(file_tree)

