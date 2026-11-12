"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "./ui";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false, loading: () => <Skeleton className="h-full min-h-[240px] w-full rounded-none" /> });
export default RouteMap;
