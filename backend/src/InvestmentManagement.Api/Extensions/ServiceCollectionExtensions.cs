using System.Text;
using InvestmentManagement.Api.HostedServices;
using InvestmentManagement.Api.Options;
using InvestmentManagement.Api.Payments;
using InvestmentManagement.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace InvestmentManagement.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<FeatureManagementSettings>(configuration.GetSection(FeatureManagementSettings.SectionName));
        services.Configure<PaymentSettings>(configuration.GetSection(PaymentSettings.SectionName));

        services.AddSingleton<IPaymentSessionStore, InMemoryPaymentSessionStore>();
        services.AddScoped<IAdminBkashResolver, AdminBkashResolver>();
        services.AddPaymentStrategy(configuration);

        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<ICampaignService, CampaignService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<INotificationService, NotificationService>();

        services.AddHostedService<BookingExpirationHostedService>();

        services.AddSignalR();

        return services;
    }

    public static IServiceCollection AddPaymentStrategy(this IServiceCollection services, IConfiguration configuration)
    {
        var useMock = configuration.GetValue<bool>($"{FeatureManagementSettings.SectionName}:UseMockPayment");

        if (useMock)
            services.AddScoped<IPaymentStrategy, MockPaymentStrategy>();
        else
            services.AddScoped<IPaymentStrategy, BkashPaymentStrategy>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException("Jwt configuration is missing.");

        if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || jwtSettings.SecretKey.Length < 32)
            throw new InvalidOperationException("Jwt:SecretKey must be at least 32 characters.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/hubs", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole(nameof(Domain.Enums.UserRole.Admin)));
            options.AddPolicy("CompanyOnly", policy => policy.RequireRole(nameof(Domain.Enums.UserRole.Company)));
            options.AddPolicy("InvestorOnly", policy => policy.RequireRole(nameof(Domain.Enums.UserRole.Investor)));
        });

        return services;
    }
}
