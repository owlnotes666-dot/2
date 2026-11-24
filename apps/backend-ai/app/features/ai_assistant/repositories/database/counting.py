def require_exact_count(count: int | None) -> int:
    if count is None:
        raise RuntimeError("The database did not return an exact row count.")

    return count
