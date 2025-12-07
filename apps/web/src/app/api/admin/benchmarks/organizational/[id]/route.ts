// Admin API for individual organizational benchmark operations
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import type { OrganizationalBenchmarkInput } from '@scleorg/types';

// GET - Fetch single organizational benchmark
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const benchmark = await prisma.organizationalBenchmark.findUnique({
    where: { id: params.id },
    include: {
      source: true,
    },
  });

  if (!benchmark) {
    return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
  }

  return NextResponse.json(benchmark);
}

// PATCH - Update organizational benchmark
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await prisma.organizationalBenchmark.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
  }

  const body: Partial<OrganizationalBenchmarkInput> & {
    approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  } = await request.json();

  // Build update data object
  const updateData: any = {
    industry: body.industry,
    region: body.region,
    companySize: body.companySize,
    growthStage: body.growthStage,
    benchmarkType: body.benchmarkType,
    metricName: body.metricName,
    p10Value: body.p10Value,
    p25Value: body.p25Value,
    p50Value: body.p50Value,
    p75Value: body.p75Value,
    p90Value: body.p90Value,
    departmentData: body.departmentData,
    sampleSize: body.sampleSize,
    currency: body.currency,
    unit: body.unit,
    sourceId: body.sourceId,
    effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
    expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
    notes: body.notes,
    methodology: body.methodology,
    lastVerified: new Date(), // Update verification timestamp
  };

  // Handle approval status changes
  if (body.approvalStatus) {
    updateData.approvalStatus = body.approvalStatus;

    if (body.approvalStatus === 'APPROVED') {
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null; // Clear any previous rejection reason
    } else if (body.approvalStatus === 'REJECTED') {
      updateData.rejectionReason = body.rejectionReason || 'No reason provided';
      updateData.approvedBy = null;
      updateData.approvedAt = null;
    } else if (body.approvalStatus === 'PENDING') {
      updateData.approvedBy = null;
      updateData.approvedAt = null;
      updateData.rejectionReason = null;
    }
  }

  // Update the benchmark
  const updated = await prisma.organizationalBenchmark.update({
    where: { id: params.id },
    data: updateData,
    include: {
      source: true,
    },
  });

  // Create audit log
  await prisma.benchmarkAuditLog.create({
    data: {
      resourceType: 'OrganizationalBenchmark',
      resourceId: params.id,
      action: 'UPDATE',
      userId: user.id,
      sourceId: body.sourceId || null,
      previousData: existing,
      newData: updated,
      changeReason: 'Benchmark updated via admin API',
    },
  });

  return NextResponse.json(updated);
}

// DELETE - Delete organizational benchmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await prisma.organizationalBenchmark.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
  }

  // Create audit log before deletion
  await prisma.benchmarkAuditLog.create({
    data: {
      resourceType: 'OrganizationalBenchmark',
      resourceId: params.id,
      action: 'DELETE',
      userId: user.id,
      previousData: existing,
      changeReason: 'Benchmark deleted via admin API',
    },
  });

  // Delete the benchmark
  await prisma.organizationalBenchmark.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true, message: 'Benchmark deleted' });
}
