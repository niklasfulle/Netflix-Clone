import { redirect } from "next/navigation";

export default function Add() {
  redirect("/admin/movies/new");
}
