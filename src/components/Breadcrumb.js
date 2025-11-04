import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/">Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const isProduct = value === 'product';
          const isCompany = value === 'company';

          if (isLast || isProduct || isCompany) {
            return (
              <li key={to} className="breadcrumb-item active" aria-current="page">
                {value}
              </li>
            );
          } else {
            return (
              <li key={to} className="breadcrumb-item">
                <Link to={to}>{value}</Link>
              </li>
            );
          }
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;