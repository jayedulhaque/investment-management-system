namespace InvestmentManagement.Api.Options;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "InvestmentManagement";
    public string Audience { get; set; } = "InvestmentManagement";
    public string SecretKey { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 60;
}
