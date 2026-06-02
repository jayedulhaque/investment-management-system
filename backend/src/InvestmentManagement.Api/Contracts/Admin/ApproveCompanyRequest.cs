using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Admin;

public class ApproveCompanyRequest
{
    [Required]
    public bool Approve { get; set; }
}
