import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useSearchParams = <T>() => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const searchParamsObject = useMemo(
    () =>
      Array.from(searchParams.entries()).reduce<
        Record<string, string | string[] | undefined>
      >((acc, [key, value]) => {
        const currenValue = acc[key];
        if (Array.isArray(currenValue)) {
          currenValue.push(value);
        } else if (currenValue) {
          acc[key] = [currenValue, value];
        } else {
          acc[key] = value;
        }

        return acc;
      }, {}),
    [searchParams]
  );

  const setSearchParams = useCallback(
    (params: Partial<T>) => {
      Object.entries(params).forEach(([key, value]) => {
        if (!value) {
          searchParams.delete(key);
        } else if (Array.isArray(value)) {
          searchParams.delete(key);
          value.forEach((v) => {
            searchParams.append(key, v.toString());
          });
        } else {
          searchParams.set(key, String(value));
        }
      });

      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true }
      );
    },
    [navigate, location.pathname, searchParams]
  );

  return { searchParams, searchParamsObject, setSearchParams };
};
