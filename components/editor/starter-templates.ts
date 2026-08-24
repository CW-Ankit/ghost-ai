import { MarkerType } from "@xyflow/react";
import { CanvasEdge, CanvasNode, NodeColorKey, NodeShape } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function createTemplateNode(
  id: string,
  label: string,
  shape: NodeShape,
  color: NodeColorKey,
  x: number,
  y: number,
  width?: number,
  height?: number
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: {
      label,
      shape,
      color,
    },
    style: width && height ? { width, height } : undefined,
  };
}

function createTemplateEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
  sourceHandle?: string,
  targetHandle?: string
): CanvasEdge {
  return {
    id,
    source,
    target,
    sourceHandle: sourceHandle || "bottom-source",
    targetHandle: targetHandle || "top-target",
    type: "canvasEdge",
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      label: label || "",
    },
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-ecommerce",
    name: "Microservices E-Commerce",
    category: "Microservices",
    description: "Classic microservices architecture with an API gateway, domain microservices, databases, caching, and a message broker.",
    nodes: [
      createTemplateNode("client", "Web & Mobile Clients", "rectangle", "blue", 350, 0, 180, 60),
      createTemplateNode("cdn", "CDN / Edge", "hexagon", "teal", 350, 110, 180, 60),
      createTemplateNode("gateway", "API Gateway", "rectangle", "orange", 350, 220, 180, 60),
      createTemplateNode("auth-service", "Auth Service", "pill", "purple", 100, 340, 160, 60),
      createTemplateNode("order-service", "Order Service", "pill", "green", 350, 340, 160, 60),
      createTemplateNode("product-service", "Product Service", "pill", "blue", 600, 340, 160, 60),
      createTemplateNode("auth-db", "Auth DB (Postgres)", "cylinder", "purple", 100, 470, 160, 70),
      createTemplateNode("order-db", "Order DB (Postgres)", "cylinder", "green", 350, 470, 160, 70),
      createTemplateNode("cache", "Redis Cache", "cylinder", "red", 600, 470, 160, 70),
      createTemplateNode("event-bus", "Event Bus (Kafka)", "rectangle", "orange", 350, 600, 180, 60),
      createTemplateNode("notification-svc", "Notification Svc", "pill", "pink", 100, 600, 160, 60),
      createTemplateNode("analytics-svc", "Analytics Service", "pill", "default", 600, 600, 160, 60),
    ],
    edges: [
      createTemplateEdge("e1", "client", "cdn", "HTTPS", "bottom-source", "top-target"),
      createTemplateEdge("e2", "cdn", "gateway", "Reverse Proxy", "bottom-source", "top-target"),
      createTemplateEdge("e3", "gateway", "auth-service", "Validate", "left-source", "top-target"),
      createTemplateEdge("e4", "gateway", "order-service", "Orders", "bottom-source", "top-target"),
      createTemplateEdge("e5", "gateway", "product-service", "Products", "right-source", "top-target"),
      createTemplateEdge("e6", "auth-service", "auth-db", "Read/Write", "bottom-source", "top-target"),
      createTemplateEdge("e7", "order-service", "order-db", "Transactions", "bottom-source", "top-target"),
      createTemplateEdge("e8", "product-service", "cache", "Read / Cache", "bottom-source", "top-target"),
      createTemplateEdge("e9", "order-service", "event-bus", "Publish Event", "bottom-source", "top-target"),
      createTemplateEdge("e10", "event-bus", "notification-svc", "Subscribe", "left-source", "right-target"),
      createTemplateEdge("e11", "event-bus", "analytics-svc", "Stream", "right-source", "left-target"),
    ],
  },
  {
    id: "event-driven-pipeline",
    name: "Event-Driven Analytics",
    category: "Data & Analytics",
    description: "Scalable real-time streaming pipeline processing events with Kafka, stream workers, time-series storage, and dashboards.",
    nodes: [
      createTemplateNode("producers", "Event Producers", "circle", "default", 50, 180, 140, 60),
      createTemplateNode("ingest-api", "Ingestion API", "pill", "blue", 260, 180, 160, 60),
      createTemplateNode("message-broker", "Apache Kafka", "rectangle", "orange", 490, 175, 180, 70),
      createTemplateNode("stream-proc", "Stream Processor", "diamond", "purple", 740, 170, 170, 80),
      createTemplateNode("realtime-db", "Time Series DB", "cylinder", "green", 1000, 70, 160, 70),
      createTemplateNode("data-lake", "Data Lake (S3)", "cylinder", "teal", 1000, 280, 160, 70),
      createTemplateNode("dashboard", "Live Dashboard", "rectangle", "pink", 1240, 75, 160, 60),
      createTemplateNode("bi-analytics", "BI Analytics", "rectangle", "default", 1240, 285, 160, 60),
    ],
    edges: [
      createTemplateEdge("ed1", "producers", "ingest-api", "Events", "right-source", "left-target"),
      createTemplateEdge("ed2", "ingest-api", "message-broker", "Produce", "right-source", "left-target"),
      createTemplateEdge("ed3", "message-broker", "stream-proc", "Stream", "right-source", "left-target"),
      createTemplateEdge("ed4", "stream-proc", "realtime-db", "Metrics", "top-source", "left-target"),
      createTemplateEdge("ed5", "stream-proc", "data-lake", "Raw Events", "bottom-source", "left-target"),
      createTemplateEdge("ed6", "realtime-db", "dashboard", "Query", "right-source", "left-target"),
      createTemplateEdge("ed7", "data-lake", "bi-analytics", "Batch Read", "right-source", "left-target"),
    ],
  },
  {
    id: "serverless-web-app",
    name: "Serverless Web Application",
    category: "Cloud Native",
    description: "Cloud-native serverless architecture with global CDN, API gateway, compute functions, and managed datastores.",
    nodes: [
      createTemplateNode("users", "User Clients", "circle", "blue", 50, 180, 130, 60),
      createTemplateNode("dns-cdn", "Edge CDN", "hexagon", "purple", 250, 180, 150, 60),
      createTemplateNode("frontend-host", "Static Hosting", "cylinder", "teal", 470, 70, 160, 70),
      createTemplateNode("api-gw", "API Gateway", "rectangle", "orange", 470, 280, 160, 60),
      createTemplateNode("auth-provider", "Auth Service", "diamond", "pink", 470, 430, 160, 70),
      createTemplateNode("lambda-core", "Lambda Functions", "pill", "green", 700, 280, 160, 60),
      createTemplateNode("nosql-db", "NoSQL Database", "cylinder", "red", 930, 210, 150, 70),
      createTemplateNode("object-store", "Object Storage", "cylinder", "teal", 930, 350, 150, 70),
    ],
    edges: [
      createTemplateEdge("s1", "users", "dns-cdn", "HTTPS", "right-source", "left-target"),
      createTemplateEdge("s2", "dns-cdn", "frontend-host", "Assets", "top-source", "left-target"),
      createTemplateEdge("s3", "dns-cdn", "api-gw", "API Requests", "bottom-source", "left-target"),
      createTemplateEdge("s4", "api-gw", "auth-provider", "Token Verify", "bottom-source", "top-target"),
      createTemplateEdge("s5", "api-gw", "lambda-core", "Invoke", "right-source", "left-target"),
      createTemplateEdge("s6", "lambda-core", "nosql-db", "CRUD", "top-source", "left-target"),
      createTemplateEdge("s7", "lambda-core", "object-store", "File Uploads", "bottom-source", "left-target"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Deployment Pipeline",
    category: "DevOps",
    description: "Automated continuous integration and deployment pipeline with test automation, artifact publishing, and environment deployments.",
    nodes: [
      createTemplateNode("developer", "Developer", "circle", "blue", 50, 160, 130, 60),
      createTemplateNode("git-repo", "Source Repo", "rectangle", "purple", 250, 160, 150, 60),
      createTemplateNode("ci-runner", "CI Runner", "pill", "orange", 470, 160, 150, 60),
      createTemplateNode("tests", "Unit / E2E Tests", "diamond", "teal", 690, 60, 160, 70),
      createTemplateNode("security-scan", "Security Scanner", "diamond", "red", 690, 260, 160, 70),
      createTemplateNode("container-reg", "Container Registry", "cylinder", "yellow", 920, 160, 170, 70),
      createTemplateNode("staging", "Staging Cluster", "rectangle", "green", 1160, 60, 160, 60),
      createTemplateNode("production", "Production Cluster", "rectangle", "green", 1160, 260, 160, 60),
    ],
    edges: [
      createTemplateEdge("c1", "developer", "git-repo", "Commit / PR", "right-source", "left-target"),
      createTemplateEdge("c2", "git-repo", "ci-runner", "Webhook", "right-source", "left-target"),
      createTemplateEdge("c3", "ci-runner", "tests", "Trigger", "top-source", "left-target"),
      createTemplateEdge("c4", "ci-runner", "security-scan", "Scan", "bottom-source", "left-target"),
      createTemplateEdge("c5", "tests", "container-reg", "Build & Push", "right-source", "top-target"),
      createTemplateEdge("c6", "security-scan", "container-reg", "Verify & Sign", "right-source", "bottom-target"),
      createTemplateEdge("c7", "container-reg", "staging", "Auto Deploy", "top-source", "left-target"),
      createTemplateEdge("c8", "staging", "production", "Promote", "bottom-source", "top-target"),
    ],
  },
];
