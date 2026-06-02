using InvestmentManagement.Api.Contracts.Bookings;

namespace InvestmentManagement.Api.Services;

public interface IBookingService
{
    Task<BookingResponse> CreateBookingAsync(Guid investorId, CreateBookingRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse> CancelBookingAsync(Guid investorId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingResponse> UpdateBookingStatusAsync(Guid companyUserId, Guid bookingId, UpdateBookingStatusRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse> ResellBookingAsync(Guid investorId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BookingResponse>> GetInvestorBookingsAsync(Guid investorId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BookingResponse>> GetCompanyBookingsAsync(Guid companyUserId, Guid? campaignId, CancellationToken cancellationToken = default);
}
