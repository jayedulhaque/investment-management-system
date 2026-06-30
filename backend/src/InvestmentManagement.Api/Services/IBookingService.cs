using InvestmentManagement.Api.Contracts.Bookings;
using InvestmentManagement.Api.Contracts.Common;

namespace InvestmentManagement.Api.Services;

public interface IBookingService
{
    Task<BookingResponse> CreateBookingAsync(Guid investorId, CreateBookingRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse> CancelBookingAsync(Guid investorId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingResponse> UpdateBookingStatusAsync(Guid companyUserId, Guid bookingId, UpdateBookingStatusRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse> ResellBookingAsync(Guid investorId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingResponse> ApproveResellBookingAsync(Guid companyUserId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingResponse> RejectResellBookingAsync(Guid companyUserId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<PagedResponse<BookingResponse>> GetInvestorBookingsAsync(
        Guid investorId,
        InvestorBookingListQuery query,
        CancellationToken cancellationToken = default);
    Task<BookingDetailResponse> GetInvestorBookingDetailAsync(
        Guid investorId,
        Guid bookingId,
        CancellationToken cancellationToken = default);
    Task<PagedResponse<BookingResponse>> GetCompanyBookingsAsync(
        Guid companyUserId,
        CompanyBookingListQuery query,
        CancellationToken cancellationToken = default);
    Task<CompanyBookingDetailResponse> GetCompanyBookingDetailAsync(
        Guid companyUserId,
        Guid bookingId,
        CancellationToken cancellationToken = default);
}
