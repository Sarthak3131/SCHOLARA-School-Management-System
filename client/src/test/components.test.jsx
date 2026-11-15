import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  Button,
  Badge,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Modal,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableEmptyState,
  TablePagination,
} from '@/components/ui/index.js';

describe('SCHOLARA UI Component Suite', () => {
  describe('Button', () => {
    it('renders label and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit Record</Button>);
      const btn = screen.getByRole('button', { name: /Submit Record/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when isLoading is true and renders spinner', () => {
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Processing</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders with different variants without error', () => {
      const { rerender } = render(<Button variant="gold">Gold Action</Button>);
      expect(screen.getByText('Gold Action')).toBeInTheDocument();

      rerender(<Button variant="danger">Delete</Button>);
      expect(screen.getByText('Delete')).toBeInTheDocument();

      rerender(<Button variant="secondary">Cancel</Button>);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge text and dot indicator', () => {
      render(<Badge variant="success" dot>Active Term</Badge>);
      expect(screen.getByText('Active Term')).toBeInTheDocument();
    });

    it('renders different status variants', () => {
      const { rerender } = render(<Badge variant="danger">Defaulter</Badge>);
      expect(screen.getByText('Defaulter')).toBeInTheDocument();

      rerender(<Badge variant="gold">Honor Roll</Badge>);
      expect(screen.getByText('Honor Roll')).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('renders label, input, and updates value', () => {
      const handleChange = vi.fn();
      render(
        <Input
          label="Student Name"
          name="studentName"
          placeholder="Enter name"
          onChange={handleChange}
        />
      );
      expect(screen.getByText(/Student Name/i)).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Enter name');
      fireEvent.change(input, { target: { value: 'Eleanor' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('displays error message when provided', () => {
      render(
        <Input
          label="Email"
          name="email"
          error="Institutional email is required"
        />
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Institutional email is required');
    });
  });

  describe('Select', () => {
    it('renders select with options and handles selection', () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Academic Class"
          name="classSelect"
          options={[
            { value: '10A', label: 'Grade 10-A' },
            { value: '10B', label: 'Grade 10-B' },
          ]}
          onChange={handleChange}
        />
      );
      expect(screen.getByText(/Academic Class/i)).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '10B' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Card & StatCard', () => {
    it('renders card title, content and children', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Overall compliance is 94%</p>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('Attendance Summary')).toBeInTheDocument();
      expect(screen.getByText('Overall compliance is 94%')).toBeInTheDocument();
    });

    it('renders StatCard with title, value, and trend', () => {
      render(
        <StatCard
          title="Total Faculty"
          value="84"
          trend={{ value: '+5%', isPositive: true, label: 'vs last year' }}
        />
      );
      expect(screen.getByText('Total Faculty')).toBeInTheDocument();
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('renders modal dialog when isOpen is true', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Register Faculty"
          footer={<Button onClick={handleClose}>Close</Button>}
        >
          <p>Modal body content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Register Faculty')).toBeInTheDocument();
      expect(screen.getByText('Modal body content')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render modal when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
          <p>Should not be visible</p>
        </Modal>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Table & Pagination', () => {
    it('renders table headers and rows properly', () => {
      render(
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>STU-01</Td>
                <Td>Arthur</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      );
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('STU-01')).toBeInTheDocument();
      expect(screen.getByText('Arthur')).toBeInTheDocument();
    });

    it('renders table empty state when no data exists', () => {
      render(
        <TableContainer>
          <Table>
            <Tbody>
              <TableEmptyState
                title="No students available"
                description="Please add a new record"
              />
            </Tbody>
          </Table>
        </TableContainer>
      );
      expect(screen.getByText('No students available')).toBeInTheDocument();
      expect(screen.getByText('Please add a new record')).toBeInTheDocument();
    });

    it('renders pagination and handles page changes', () => {
      const handlePageChange = vi.fn();
      render(
        <TablePagination
          page={2}
          limit={10}
          total={50}
          onPageChange={handlePageChange}
        />
      );
      expect(screen.getByText(/Showing/i)).toBeInTheDocument();
      expect(screen.getByText(/Page 2 of 5/i)).toBeInTheDocument();
      const prevBtn = screen.getByRole('button', { name: /Previous/i });
      fireEvent.click(prevBtn);
      expect(handlePageChange).toHaveBeenCalledWith(1);
    });
  });
});
