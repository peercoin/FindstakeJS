FROM golang:1.21
WORKDIR /app
COPY go.mod go.sum gowebserver.go ./
RUN go mod download
COPY commands ./commands/
COPY configs ./configs/
RUN echo $(ls)
RUN CGO_ENABLED=0 GOOS=linux go build -o /gowebserver gowebserver.go
EXPOSE 9009
CMD [ "/gowebserver" ]