FROM mcr.microsoft.com/dotnet/aspnet:8.0
ENV TZ=Europe/Amsterdam
WORKDIR /srv
COPY bin/Release/net8.0/linux-x64/publish/ .
ENTRYPOINT ["dotnet", "WalletProxy.dll"]