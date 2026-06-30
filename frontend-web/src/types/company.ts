export type CompanyRegistrationInfo = {
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  description: string;
  website?: string;
  phone?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  documentationUrl: string;
};

export type CompanyProfile = CompanyRegistrationInfo & {
  email: string;
  approvalStatus: string;
};

export const companyProfileFromRegistration = (
  info: CompanyRegistrationInfo,
): CompanyRegistrationInfo => ({
  companyName: info.companyName,
  legalName: info.legalName ?? '',
  registrationNumber: info.registrationNumber ?? '',
  description: info.description,
  website: info.website ?? '',
  phone: info.phone ?? '',
  contactEmail: info.contactEmail ?? '',
  address: info.address ?? '',
  city: info.city ?? '',
  country: info.country ?? '',
  industry: info.industry ?? '',
  documentationUrl: info.documentationUrl,
});

export const toCompanyProfileUpdatePayload = (info: CompanyRegistrationInfo) => ({
  companyName: info.companyName.trim(),
  description: info.description.trim(),
  documentationUrl: info.documentationUrl.trim(),
  legalName: info.legalName?.trim() || null,
  registrationNumber: info.registrationNumber?.trim() || null,
  website: info.website?.trim() || null,
  phone: info.phone?.trim() || null,
  contactEmail: info.contactEmail?.trim() || null,
  address: info.address?.trim() || null,
  city: info.city?.trim() || null,
  country: info.country?.trim() || null,
  industry: info.industry?.trim() || null,
});

export const emptyCompanyRegistration = (): CompanyRegistrationInfo => ({
  companyName: '',
  legalName: '',
  registrationNumber: '',
  description: '',
  website: '',
  phone: '',
  contactEmail: '',
  address: '',
  city: '',
  country: '',
  industry: '',
  documentationUrl: '',
});
