export interface LanguageConfig {
  id: string;
  name: string;
  monacoLanguage: string;
  judge0Id: number;
  extension: string;
  version: string;
  starterCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'python',
    name: 'Python (3.8.1)',
    monacoLanguage: 'python',
    judge0Id: 71,
    extension: '.py',
    version: '3.8.1',
    starterCode: `def solve():
    # Write your solution here
    print("Hello from Python Sandbox!")

if __name__ == "__main__":
    solve()
`
  },
  {
    id: 'cpp',
    name: 'C++ (GCC 9.2.0)',
    monacoLanguage: 'cpp',
    judge0Id: 54,
    extension: '.cpp',
    version: 'GCC 9.2.0',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++ Sandbox!" << endl;
    return 0;
}
`
  },
  {
    id: 'c',
    name: 'C (GCC 9.2.0)',
    monacoLanguage: 'c',
    judge0Id: 50,
    extension: '.c',
    version: 'GCC 9.2.0',
    starterCode: `#include <stdio.h>

int main() {
    printf("Hello from C Sandbox!\\n");
    return 0;
}
`
  },
  {
    id: 'java',
    name: 'Java (OpenJDK 13.0.1)',
    monacoLanguage: 'java',
    judge0Id: 62,
    extension: '.java',
    version: 'OpenJDK 13.0.1',
    starterCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Sandbox!");
    }
}
`
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js 12.14.0)',
    monacoLanguage: 'javascript',
    judge0Id: 63,
    extension: '.js',
    version: 'Node.js 12.14.0',
    starterCode: `function main() {
    console.log("Hello from JavaScript Sandbox!");
}

main();
`
  },
  {
    id: 'typescript',
    name: 'TypeScript (3.7.4)',
    monacoLanguage: 'typescript',
    judge0Id: 74,
    extension: '.ts',
    version: '3.7.4',
    starterCode: `function greet(name: string): void {
    console.log(\`Hello \${name} from TypeScript Sandbox!\`);
}

greet("Developer");
`
  },
  {
    id: 'go',
    name: 'Go (1.13.5)',
    monacoLanguage: 'go',
    judge0Id: 60,
    extension: '.go',
    version: '1.13.5',
    starterCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go Sandbox!")
}
`
  },
  {
    id: 'rust',
    name: 'Rust (1.40.0)',
    monacoLanguage: 'rust',
    judge0Id: 73,
    extension: '.rs',
    version: '1.40.0',
    starterCode: `fn main() {
    println!("Hello from Rust Sandbox!");
}
`
  },
  {
    id: 'csharp',
    name: 'C# (Mono 6.6.0.161)',
    monacoLanguage: 'csharp',
    judge0Id: 51,
    extension: '.cs',
    version: 'Mono 6.6.0.161',
    starterCode: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from C# Sandbox!");
    }
}
`
  },
  {
    id: 'php',
    name: 'PHP (7.4.1)',
    monacoLanguage: 'php',
    judge0Id: 68,
    extension: '.php',
    version: '7.4.1',
    starterCode: `<?php
echo "Hello from PHP Sandbox!\\n";
?>
`
  },
  {
    id: 'kotlin',
    name: 'Kotlin (1.3.70)',
    monacoLanguage: 'kotlin',
    judge0Id: 78,
    extension: '.kt',
    version: '1.3.70',
    starterCode: `fun main() {
    println("Hello from Kotlin Sandbox!")
}
`
  },
  {
    id: 'ruby',
    name: 'Ruby (2.7.0)',
    monacoLanguage: 'ruby',
    judge0Id: 72,
    extension: '.rb',
    version: '2.7.0',
    starterCode: `puts "Hello from Ruby Sandbox!"
`
  },
  {
    id: 'swift',
    name: 'Swift (5.2.3)',
    monacoLanguage: 'swift',
    judge0Id: 83,
    extension: '.swift',
    version: '5.2.3',
    starterCode: `print("Hello from Swift Sandbox!")
`
  }
];

const ALIAS_MAP: Record<string, string> = {
  py: 'python',
  python3: 'python',
  'c++': 'cpp',
  js: 'javascript',
  ts: 'typescript',
  cs: 'csharp',
  'c#': 'csharp',
  kt: 'kotlin',
  rb: 'ruby',
  golang: 'go',
  rs: 'rust'
};

export function getLanguageConfig(idOrAlias?: string): LanguageConfig {
  if (!idOrAlias) return SUPPORTED_LANGUAGES[0];
  const clean = idOrAlias.toLowerCase().trim();
  const targetId = ALIAS_MAP[clean] || clean;

  const found = SUPPORTED_LANGUAGES.find(l => l.id === targetId || l.monacoLanguage === targetId);
  return found || SUPPORTED_LANGUAGES[0];
}

export function getJudge0Id(idOrAlias?: string): number {
  return getLanguageConfig(idOrAlias).judge0Id;
}

export function getMonacoLanguage(idOrAlias?: string): string {
  return getLanguageConfig(idOrAlias).monacoLanguage;
}
