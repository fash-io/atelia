import { supabase } from "@/integrations/supabase/client";

export async function uploadWorkImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("work-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("work-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadApplicationFile(
  userId: string,
  jobId: string,
  file: File,
  kind: "resume" | "proof",
): Promise<string> {
  if (file.size > 15 * 1024 * 1024) throw new Error("File must be under 15MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${userId}/${jobId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("applications").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  // Bucket is private — return long-lived signed URL (1 year) so download chips
  // keep working for applicants and job posters without re-signing on every view.
  const { data, error: signErr } = await supabase.storage
    .from("applications")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr) throw signErr;
  return data.signedUrl;
}
