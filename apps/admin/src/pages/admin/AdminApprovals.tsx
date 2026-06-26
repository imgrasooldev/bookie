import { PageHeader } from "../../components/ui";
import { ListingsTable } from "../../components/ListingsTable";

export function AdminApprovals() {
  return (
    <div>
      <PageHeader title="Listing approvals" subtitle="Review operator listings before they go live on the customer site." />
      <ListingsTable title="Listings" subtitle="Approve or unpublish operator listings." defaultStatus="pending" />
    </div>
  );
}
