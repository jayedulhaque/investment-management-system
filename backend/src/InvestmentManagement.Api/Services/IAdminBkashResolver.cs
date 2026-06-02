namespace InvestmentManagement.Api.Services;

public interface IAdminBkashResolver
{
    Task<string> GetReceivingBkashNumberAsync(CancellationToken cancellationToken = default);
}
