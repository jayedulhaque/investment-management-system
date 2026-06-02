using InvestmentManagement.Api.Domain.Enums;

namespace InvestmentManagement.Api.Domain.Entities;

public class CompanyProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string DocumentationUrl { get; set; } = string.Empty;
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

    public User User { get; set; } = null!;
    public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
}
