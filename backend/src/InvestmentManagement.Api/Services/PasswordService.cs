using InvestmentManagement.Api.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace InvestmentManagement.Api.Services;

public class PasswordService : IPasswordService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string HashPassword(User user, string password) => _hasher.HashPassword(user, password);

    public bool VerifyPassword(User user, string password) =>
        _hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
}
