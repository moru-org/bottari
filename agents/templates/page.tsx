import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "[PAGE_TITLE] — BOTTARI",
  description: "[PAGE_DESCRIPTION]",
};

export default async function [PAGE_NAME]() {
  const db = getDb();
  const headersList = await headers();

  // TODO: fetch data here

  return (
    <main className="min-h-screen bg-bottari-dark text-bottari-text">
      <div className="mx-auto max-w-[448px] px-4 py-6">
        <h1 className="text-2xl font-bold">[PAGE_TITLE_KOREAN]</h1>
        <p className="mt-4 text-sm text-bottari-text-muted">
          [PAGE_DESCRIPTION_KOREAN]
        </p>
      </div>
    </main>
  );
}
