export type InvestorRegistrationInfo = {
  fullName: string;
  phone: string;
  nationalId: string;
  dateOfBirth?: string;
  occupation?: string;
  address: string;
  city: string;
  country: string;
  contactEmail?: string;
};

export type InvestorProfile = InvestorRegistrationInfo & {
  email: string;
  isActive: boolean;
};

export const investorProfileFromRegistration = (
  info: InvestorRegistrationInfo,
): InvestorRegistrationInfo => ({
  fullName: info.fullName,
  phone: info.phone,
  nationalId: info.nationalId,
  dateOfBirth: info.dateOfBirth ?? '',
  occupation: info.occupation ?? '',
  address: info.address,
  city: info.city,
  country: info.country,
  contactEmail: info.contactEmail ?? '',
});

export const toInvestorProfileUpdatePayload = (info: InvestorRegistrationInfo) => ({
  fullName: info.fullName.trim(),
  phone: info.phone.trim(),
  nationalId: info.nationalId.trim(),
  dateOfBirth: info.dateOfBirth?.trim() || null,
  occupation: info.occupation?.trim() || null,
  address: info.address.trim(),
  city: info.city.trim(),
  country: info.country.trim(),
  contactEmail: info.contactEmail?.trim() || null,
});

export const emptyInvestorRegistration = (): InvestorRegistrationInfo => ({
  fullName: '',
  phone: '',
  nationalId: '',
  dateOfBirth: '',
  occupation: '',
  address: '',
  city: '',
  country: 'Bangladesh',
  contactEmail: '',
});
