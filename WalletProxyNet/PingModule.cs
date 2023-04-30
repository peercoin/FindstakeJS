using Carter;

namespace WalletProxy;

public class PingModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/ping", (HttpResponse res) =>
        {
            res.StatusCode = 200;
            return Results.Text("pong");
        });
    }
}