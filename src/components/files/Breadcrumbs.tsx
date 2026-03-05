"use client";

import Link from "next/link";

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function Breadcrumbs({
  path,
  currentFolderId,
}: {
  path: BreadcrumbItem[];
  currentFolderId?: string | null;
}) {
  const showCollapsed = path.length > 2;

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm">
      <Link
        href="/files"
        className={`shrink-0 rounded px-1.5 py-0.5 transition-colors hover:bg-bg-tertiary ${
          !currentFolderId
            ? "font-medium text-fg-primary"
            : "text-fg-secondary"
        }`}
      >
        Files
      </Link>
      {showCollapsed ? (
        <>
          <span className="text-fg-tertiary">/</span>
          <span className="text-fg-tertiary">…</span>
          <span className="text-fg-tertiary">/</span>
          <span className="truncate rounded px-1.5 py-0.5 font-medium text-fg-primary">
            {path[path.length - 1].name}
          </span>
        </>
      ) : (
        path.map((item, i) => (
          <span key={item.id} className="flex min-w-0 items-center gap-1">
            <span className="text-fg-tertiary">/</span>
            {i === path.length - 1 ? (
              <span className="truncate rounded px-1.5 py-0.5 font-medium text-fg-primary">
                {item.name}
              </span>
            ) : (
              <Link
                href={`/files?folderId=${item.id}`}
                className="truncate rounded px-1.5 py-0.5 text-fg-secondary transition-colors hover:bg-bg-tertiary"
              >
                {item.name}
              </Link>
            )}
          </span>
        ))
      )}
    </nav>
  );
}
