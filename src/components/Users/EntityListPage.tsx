import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Toolbar,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export interface Column<T> {
  field: keyof T | string;
  label: string;
  width?: string | number;
  render?: (row: T) => React.ReactNode;
}

export interface EntityListPageProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  /** which field is used for the quick text filter */
  searchField?: keyof T;
  searchPlaceholder?: string;

  /** optional select filter (e.g. status) */
  filterLabel?: string;
  filterField?: keyof T;
  filterOptions?: { label: string; value: string }[];

  /** callbacks – here you plug modals / navigation / API calls */
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;

  pageSize?: number;
}

function EntityListPage<T extends { id: string | number }>({
  title,
  columns,
  rows,
  searchField,
  searchPlaceholder = "Search…",
  filterLabel,
  filterField,
  filterOptions = [],
  onCreate,
  onEdit,
  onDelete,
  pageSize = 5,
}: EntityListPageProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState<string>("__all__");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    let data = [...rows];

    // text search
    if (searchField && search.trim() !== "") {
      const term = search.toLowerCase();
      data = data.filter((row) => {
        const value = String(row[searchField] ?? "").toLowerCase();
        return value.includes(term);
      });
    }

    // extra select filter
    if (filterField && filterValue !== "__all__") {
      data = data.filter(
        (row) => String(row[filterField] ?? "") === filterValue
      );
    }

    return data;
  }, [rows, search, searchField, filterField, filterValue]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(236,254,255,0.52) 100%)",
        border: "1px solid rgba(226,232,240,0.8)",
      }}
    >
      {/* Header + actions */}
      <Toolbar disableGutters sx={{ mb: 2, justifyContent: "space-between" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#053042" }}>
          {title}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            background:
              "linear-gradient(135deg, #10b981 0%, #22c55e 50%, #a3e635 100%)",
            boxShadow: "0 12px 30px rgba(16,185,129,0.35)",
          }}
        >
          New
        </Button>
      </Toolbar>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        {searchField && (
          <TextField
            size="small"
            label={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ maxWidth: 280 }}
          />
        )}

        {filterField && filterOptions.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{filterLabel}</InputLabel>
            <Select
              label={filterLabel}
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="__all__">All</MenuItem>
              {filterOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Table */}
      <Box
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(226,232,240,0.95)",
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={String(col.field)}
                  sx={{ fontWeight: 600, fontSize: 13, width: col.width }}
                >
                  {col.label}
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{ fontWeight: 600, fontSize: 13, width: 120 }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <Typography variant="body2" sx={{ py: 3 }}>
                    No records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={String(row.id)} hover>
                  {columns.map((col) => (
                    <TableCell key={String(col.field)}>
                      {col.render
                        ? col.render(row)
                        : (row as any)[col.field as string]}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onEdit && onEdit(row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete && onDelete(row)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Pagination */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, value) => setPage(value)}
          size="small"
          shape="rounded"
        />
      </Box>
    </Box>
  );
}

export default EntityListPage;
