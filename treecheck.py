import os
import re
import ast
import astor
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
    root = Node(os.path.basename(startpath))
    allowed_extensions = ['.ts', '.tsx', '.js']

    def add_nodes(parent_node, parent_path):
        for item in os.listdir(parent_path):
            if any(ignored in item for ignored in ignore_dirs):
                continue

            item_path = os.path.join(parent_path, item)

            if os.path.isdir(item_path):
                new_node = Node(item, parent=parent_node)
                add_nodes(new_node, item_path)
            else:
                file_extension = os.path.splitext(item)[1]
                if file_extension in allowed_extensions:
                    used_apis = extract_used_apis(item_path)
                    api_info = f" ({', '.join(used_apis)})" if used_apis else ""
                    Node(f"{item}{api_info}", parent=parent_node)

    add_nodes(root, startpath)
    return root



if __name__ == "__main__":
    project_root = "."
    ignore_dirs = ["node_modules", "landing", ".git", "themes"]
    gitignore_path = os.path.join(project_root, ".gitignore")
    ignore_dirs.extend(read_gitignore(gitignore_path))

    file_list = list_files(project_root, ignore_dirs)
    for file_path in file_list:
        if file_path.endswith(".ts"):
            analyze_typescript(file_path, file_list)

    file_tree = build_file_tree(project_root, ignore_dirs)
    for pre, _, node in RenderTree(file_tree, style=AsciiStyle()):
        print(f"{pre}{node.name}")

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



