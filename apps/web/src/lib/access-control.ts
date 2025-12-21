import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';

/**
 * Check if a user has access to a dataset using Clerk Organizations.
 * A user has access if:
 * 1. The dataset belongs to their active organization
 * 2. The dataset belongs to personal workspace (no organizationId) and they own it
 *
 * @param datasetId - The ID of the dataset to check
 * @returns The dataset if the user has access, null otherwise
 */
export async function verifyDatasetAccess(datasetId: string) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return null;
  }

  // Get the dataset
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
  });

  if (!dataset) {
    return null;
  }

  // If dataset belongs to an organization
  if (dataset.organizationId) {
    // User must be viewing this organization
    if (orgId === dataset.organizationId) {
      return dataset;
    }
    return null;
  }

  // Personal dataset - check ownership
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (user && dataset.userId === user.id) {
    return dataset;
  }

  return null;
}

/**
 * Check if a user has access to a dataset (boolean version).
 *
 * @param datasetId - The ID of the dataset to check
 * @returns true if the user has access, false otherwise
 */
export async function hasDatasetAccess(datasetId: string): Promise<boolean> {
  const dataset = await verifyDatasetAccess(datasetId);
  return dataset !== null;
}
