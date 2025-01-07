FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Mavenラッパーの代わりにMavenを直接インストール
RUN apt-get update && \
    apt-get install -y maven

COPY pom.xml .
COPY src ./src

RUN mvn package -DskipTests

CMD ["java", "-jar", "target/todo-mvp-0.0.1-SNAPSHOT.jar"]