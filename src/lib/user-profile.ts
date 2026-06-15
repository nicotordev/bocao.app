export const DEFAULT_PROFILE_IMAGE = "/img/common/profile-pic.webp";

export function resolveUserProfileImage(image: string | null | undefined) {
  const trimmedImage = image?.trim();

  return trimmedImage && trimmedImage.length > 0
    ? trimmedImage
    : DEFAULT_PROFILE_IMAGE;
}
