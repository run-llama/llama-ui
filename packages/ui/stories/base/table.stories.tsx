import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableBody,
  TableCell,
  CustomTableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../base/table";
import { Badge } from "../../base/badge";
import { Button } from "../../base/button";
import { CircleGauge } from "lucide-react";

const meta: Meta<typeof Table> = {
  title: "Base/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead icon={<CircleGauge />} label="Quota Name" />
          <TableHead tooltip="Current limit value" label="Value" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell
            label="Premium Parse Concurrent Jobs"
            badge={<Badge variant="outline" label="Default" />}
          />
          <TableCell label="30" />
        </TableRow>
        <TableRow>
          <TableCell
            label="Default Parse Concurrent Jobs"
            badge={<Badge variant="outline" label="Default" />}
          />
          <TableCell label="30" />
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const PricingTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead
            alignment="center"
            badge={<Badge variant="success" label="Active" />}
            label="Free"
          />
          <TableHead alignment="center" label="Starter" />
          <TableHead alignment="center" label="Pro" />
          <TableHead alignment="center" label="Enterprise" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell strong label="Free credits" />
          <TableCell alignment="center" label="10K" />
          <TableCell alignment="center" label="50K" />
          <TableCell alignment="center" label="500K" />
          <TableCell alignment="center" label="Custom" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Paid credits" />
          <TableCell alignment="center" label="0" />
          <TableCell alignment="center" label="up to 500K ($500)" />
          <TableCell alignment="center" label="up to 5,000K ($5,000)" />
          <TableCell alignment="center" label="Custom" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Users" />
          <TableCell alignment="center" label="1" />
          <TableCell alignment="center" label="10" />
          <TableCell alignment="center" label="25" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Projects" />
          <TableCell alignment="center" label="1" />
          <TableCell alignment="center" label="1" />
          <TableCell alignment="center" label="5" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Indexes" />
          <TableCell alignment="center" label="5" />
          <TableCell alignment="center" label="50" />
          <TableCell alignment="center" label="100" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Files in index" />
          <TableCell alignment="center" label="50" />
          <TableCell alignment="center" label="500" />
          <TableCell alignment="center" label="2,000" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
        <TableRow>
          <TableCell strong label="External data sources" />
          <TableCell alignment="center" label="0" />
          <TableCell alignment="center" label="50" />
          <TableCell alignment="center" label="100" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Embedding models" />
          <TableCell alignment="center" label="1" />
          <TableCell alignment="center" label="5" />
          <TableCell alignment="center" label="25" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
        <TableRow>
          <TableCell strong label="Extraction agents" />
          <TableCell alignment="center" label="Unlimited" />
          <TableCell alignment="center" label="Unlimited" />
          <TableCell alignment="center" label="Unlimited" />
          <TableCell alignment="center" label="Unlimited" />
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const CustomContent: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead label="Status" />
          <TableHead label="Actions" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <CustomTableCell>
            <div className="flex items-center gap-2">
              <div className="bg-success size-2 rounded-full" />
              <span>Online</span>
            </div>
          </CustomTableCell>
          <CustomTableCell>
            <Button variant="link" label="Edit" />
          </CustomTableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const RowStates: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead label="Name" />
          <TableHead label="State" />
          <TableHead label="Description" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow state="default">
          <TableCell label="Default Row" />
          <TableCell label="default" />
          <TableCell label="No hover background effect" />
        </TableRow>
        <TableRow state="hover">
          <TableCell label="Hover Row" />
          <TableCell label="hover" />
          <TableCell label="Shows background on hover" />
        </TableRow>
        <TableRow state="default">
          <TableCell label="Another Default" />
          <TableCell label="default" />
          <TableCell label="No hover effect" />
        </TableRow>
        <TableRow state="hover">
          <TableCell label="Another Hover" />
          <TableCell label="hover" />
          <TableCell label="Hover to see background" />
        </TableRow>
      </TableBody>
    </Table>
  ),
};
