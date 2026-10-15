import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProductCard from './ProductCard'
import type { Product } from '../types/api'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Aurora Desk Lamp',
    slug: 'aurora-desk-lamp',
    description: null,
    price: '49.99',
    compareAtPrice: null,
    sku: null,
    stock: 10,
    isActive: true,
    isFeatured: false,
    categoryId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  )
}

describe('ProductCard', () => {
  it('shows the name, price and stock', () => {
    renderCard(makeProduct())

    expect(screen.getByText('Aurora Desk Lamp')).toBeInTheDocument()
    expect(screen.getByText('$49.99')).toBeInTheDocument()
    expect(screen.getByText('10 in stock')).toBeInTheDocument()
  })

  it('links to the product detail page', () => {
    renderCard(makeProduct())

    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/p1')
  })

  it('shows the original price when discounted', () => {
    renderCard(makeProduct({ compareAtPrice: '69.99' }))

    expect(screen.getByText('$69.99')).toBeInTheDocument()
  })

  it('does not strike through a price that is not actually lower', () => {
    // compareAtPrice below price is not a discount, and must not be shown as one.
    renderCard(makeProduct({ compareAtPrice: '39.99' }))

    expect(screen.queryByText('$39.99')).not.toBeInTheDocument()
  })

  it('reports an out-of-stock product', () => {
    renderCard(makeProduct({ stock: 0 }))

    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('shows the category when present', () => {
    renderCard(
      makeProduct({
        category: {
          id: 'c1',
          name: 'Lighting',
          slug: 'lighting',
          description: null,
          imageUrl: null,
          isActive: true,
        },
      }),
    )

    expect(screen.getByText('Lighting')).toBeInTheDocument()
  })

  it('renders an image when the product has one', () => {
    renderCard(
      makeProduct({
        images: [
          {
            id: 'i1',
            url: 'https://example.com/lamp.jpg',
            altText: 'A brass lamp',
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      }),
    )

    expect(screen.getByAltText('A brass lamp')).toBeInTheDocument()
  })
})
