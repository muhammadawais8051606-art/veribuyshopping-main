import { supabase } from "@/integrations/supabase/client";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function uploadProductImageWithProgress(args: {
  file: File;
  sellerId: string;
  onProgress?: (pct: number) => void;
}) {
  const { file, sellerId, onProgress } = args;
  const bucket = "product-images";
  const path = `${sellerId}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { data: signed, error: signedErr } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (signedErr) throw signedErr;
  if (!signed?.signedUrl) throw new Error("Could not create signed upload URL.");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signed.signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(Math.max(0, Math.min(100, pct)));
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
    };

    xhr.send(file);
  });

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = pub?.publicUrl;
  if (!publicUrl) throw new Error("Could not resolve public URL for uploaded image.");

  onProgress?.(100);
  return { path, publicUrl };
}

