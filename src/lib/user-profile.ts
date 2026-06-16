export const DEFAULT_PROFILE_IMAGE = "/img/common/profile-pic.webp";

export function resolveUserProfileImage(image: string | null | undefined) {
  const trimmedImage = image?.trim();

  return trimmedImage && trimmedImage.length > 0
    ? trimmedImage
    : DEFAULT_PROFILE_IMAGE;
}

function normalizeProfileValue(value: string) {
  return value.trim().toLowerCase();
}

export function parseProfileNameParts(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "" };
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export function formatProfileName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function userNeedsProfileName(
  name: string | null | undefined,
  email: string,
) {
  const trimmedName = name?.trim() ?? "";

  if (!trimmedName) {
    return true;
  }

  const normalizedName = normalizeProfileValue(trimmedName);
  const normalizedEmail = normalizeProfileValue(email);

  if (normalizedEmail && normalizedName === normalizedEmail) {
    return true;
  }

  const emailLocalPart = normalizedEmail.split("@")[0];
  if (emailLocalPart && normalizedName === emailLocalPart) {
    return true;
  }

  return trimmedName.split(/\s+/).filter(Boolean).length < 2;
}
