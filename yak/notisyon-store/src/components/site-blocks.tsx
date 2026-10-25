"use client";

import { useEffect, useState } from "react";
import type { SiteBlock } from "@/lib/block-store";

export function SiteBlocks({ location }: { location: SiteBlock["location"] }) {
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    fetch(`/api/site-blocks?path=${encodeURIComponent(window.location.pathname)}&location=${location}`)
      .then((response) => response.ok ? response.json() : [])
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [location]);

  useEffect(() => {
    const scripts = blocks.filter((block) => block.js.trim()).map((block) => {
      const script = document.createElement("script");
      script.dataset.siteBlock = block.id;
      script.text = block.js;
      document.body.appendChild(script);
      return script;
    });
    return () => scripts.forEach((script) => script.remove());
  }, [blocks]);

  if (!blocks.length) return null;
  return <div className={`site-block-zone site-block-zone-${location}`}>{blocks.map((block) => <section className="site-managed-block" data-block-id={block.id} key={block.id}>{block.css ? <style dangerouslySetInnerHTML={{ __html: block.css }} /> : null}<div dangerouslySetInnerHTML={{ __html: block.html }} /></section>)}</div>;
}
