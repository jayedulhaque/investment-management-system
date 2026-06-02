namespace InvestmentManagement.Api.Options;

public class PaymentSettings
{
    public const string SectionName = "Payment";

    public string ApiBaseUrl { get; set; } = "http://localhost:5000";
    public string SuccessRedirectUrl { get; set; } = "http://localhost:3000/payment/success";
    public string FailureRedirectUrl { get; set; } = "http://localhost:3000/payment/failure";
}
