namespace InvestmentManagement.Api.Contracts.Payments;

public class PaymentModeResponse
{
    public bool UseMockPayment { get; set; }
    public string Provider { get; set; } = string.Empty;
}
