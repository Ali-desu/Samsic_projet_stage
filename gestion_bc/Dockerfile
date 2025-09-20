# ========================
# Stage 1: Build
# ========================
FROM maven:3.9.0-eclipse-temurin-17 AS build
WORKDIR /app

# Copy only pom.xml first and download dependencies (better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Now copy the source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN mvn clean package -DskipTests

# ========================
# Stage 2: Run
# ========================
# Option 1: lightweight JRE image
# FROM eclipse-temurin:17-jre-jammy

# Option 2 (recommended for production): Distroless
FROM gcr.io/distroless/java17-debian11

WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/gestion_bc-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 9090

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
