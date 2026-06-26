"use client"

import * as React from "react"
import { ChevronRight, File, Folder } from "lucide-react"

export type TreeItem = string | [string, ...TreeItem[]]

interface FileTreeProps {
  data: TreeItem[]
  onFileSelect?: (fileName: string) => void
}

export const FileTree = React.memo(function FileTree({ data, onFileSelect }: FileTreeProps) {
  return (
    <ul className="space-y-1 font-sans text-sm select-none">
      {data.map((item, index) => (
        <TreeNode key={index} item={item} onFileSelect={onFileSelect} depth={0} />
      ))}
    </ul>
  )
})

const TreeNode = React.memo(function TreeNode({
  item,
  onFileSelect,
  depth,
}: {
  item: TreeItem
  onFileSelect?: (fileName: string) => void
  depth: number
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  let name = ""
  let children: TreeItem[] | null = null

  if (typeof item === "string") {
    name = item
  } else if (Array.isArray(item)) {
    name = item[0]
    children = item.slice(1)
  }

  const isFolder = children !== null && children.length > 0

  const handleToggle = () => {
    if (isFolder) {
      setIsOpen(!isOpen)
    } else if (onFileSelect) {
      onFileSelect(name)
    }
  }

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={`h-4 w-4 shrink-0 transition-transform text-zinc-400 dark:text-zinc-500 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
            <Folder className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 fill-amber-500/10" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
          </>
        )}
        <span className="truncate">{name}</span>
      </button>

      {isFolder && isOpen && children && (
        <ul className="mt-0.5">
          {children.map((subItem, index) => (
            <TreeNode
              key={index}
              item={subItem}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
})

// Dados de exemplo preservados da sidebar antiga
export const sampleFileTreeData: TreeItem[] = [
  [
    "app",
    [
      "api",
      ["hello", ["route.ts"]],
      "page.tsx",
      "layout.tsx",
      ["blog", ["page.tsx"]],
    ],
  ],
  [
    "components",
    ["ui", "button.tsx", "card.tsx"],
    "header.tsx",
    "footer.tsx",
  ],
  ["lib", ["util.ts"]],
  ["public", "favicon.ico", "vercel.svg"],
  ".eslintrc.json",
  ".gitignore",
  "next.config.js",
  "tailwind.config.js",
  "package.json",
  "README.md",
]
