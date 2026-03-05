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
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/files"
        className={`rounded px-1.5 py-0.5 transition-colors hover:bg-bg-tertiary ${
          !currentFolderId
            ? "font-medium text-fg-primary"
            : "text-fg-secondary"
        }`}
      >
        Files
      </Link>
      {path.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1">
          <span className="text-fg-tertiary">/</span>
          {i === path.length - 1 ? (
            <span className="rounded px-1.5 py-0.5 font-medium text-fg-primary">
              {item.name}
            </span>
          ) : (
            <Link
              href={`/files?folderId=${item.id}`}
              className="rounded px-1.5 py-0.5 text-fg-secondary transition-colors hover:bg-bg-tertiary"
            >
              {item.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
