import crypto from "node:crypto";
import {
  type Merchant,
  type Repository,
  type Technician,
  defaultRepository,
} from "../db/repository";

export interface MerchantOnboardingInput {
  userId: string;
  businessName: string;
  description: string;
  categories: string[];
  coverageZones: string[];
  address: string;
  latitude: number;
  longitude: number;
}

export class MerchantService {
  constructor(private repo: Repository = defaultRepository) {}

  async listMerchants(filter?: {
    category?: string;
    zone?: string;
    activeOnly?: boolean;
  }): Promise<Merchant[]> {
    let list = Array.from(this.repo.merchants.values());
    if (filter?.activeOnly !== false) {
      list = list.filter((m) => m.isActive);
    }
    if (filter?.category) {
      list = list.filter((m) => m.categories.includes(filter.category!));
    }
    if (filter?.zone) {
      list = list.filter((m) => m.coverageZones.includes(filter.zone!));
    }
    return list.sort((a, b) => b.rating - a.rating);
  }

  async getMerchant(id: string): Promise<{ merchant: Merchant; technicians: Technician[] } | null> {
    const merchant = this.repo.merchants.get(id);
    if (!merchant) return null;
    const technicians = Array.from(this.repo.technicians.values()).filter(
      (t) => t.merchantId === id && t.isActive,
    );
    return { merchant, technicians };
  }

  async onboardMerchant(input: MerchantOnboardingInput): Promise<Merchant> {
    const merchant: Merchant = {
      id: `mch-${crypto.randomUUID()}`,
      userId: input.userId,
      businessName: input.businessName,
      description: input.description,
      categories: input.categories,
      coverageZones: input.coverageZones,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      rating: 5.0,
      totalReviews: 0,
      totalJobs: 0,
      kycStatus: "verified",
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.repo.merchants.set(merchant.id, merchant);
    return merchant;
  }

  async setAvailability(merchantId: string, isAvailable: boolean): Promise<Merchant> {
    const merchant = this.repo.merchants.get(merchantId);
    if (!merchant) throw new Error("Merchant not found");
    merchant.isAvailable = isAvailable;
    return merchant;
  }

  async addTechnician(
    merchantId: string,
    name: string,
    phone: string,
    skills: string[],
  ): Promise<Technician> {
    const merchant = this.repo.merchants.get(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    const tech: Technician = {
      id: `tch-${crypto.randomUUID()}`,
      merchantId,
      name,
      phone,
      skills,
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.repo.technicians.set(tech.id, tech);
    return tech;
  }
}

export const defaultMerchantService = new MerchantService(defaultRepository);
