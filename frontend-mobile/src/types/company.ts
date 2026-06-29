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
