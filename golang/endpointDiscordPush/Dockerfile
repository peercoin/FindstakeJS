FROM golang:1.21 AS builder
WORKDIR /app
COPY go.mod go.sum gowebserver.go ./
RUN go mod download
COPY commands ./commands/
COPY configs ./configs/
RUN CGO_ENABLED=0 GOOS=linux go build -o gowebserver gowebserver.go
RUN echo $(ls)


FROM alpine:latest AS runtime 
WORKDIR /app 
COPY --from=builder /app/gowebserver . 
COPY --from=builder app/configs ./configs/
RUN echo $(ls)
EXPOSE 9009 

CMD ["chmod", "+x", "gowebserver"] 
CMD ["./gowebserver"]


 