FROM mcr.microsoft.com/dotnet/aspnet:6.0
ENV TZ=Europe/Amsterdam
WORKDIR /srv
COPY bin/Release/net6.0/linux-x64/publish/ .
ENTRYPOINT ["dotnet", "WalletProxy.dll"]