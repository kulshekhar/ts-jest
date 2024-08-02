import { render } from '@testing-library/react'

import App from '../src/App'

describe('transform-tsx', () => {
  it('should renders learn react link', () => {
    const wrapper = render(<App />)
    const linkElement = wrapper.getByText('Vite + React')

    expect(linkElement).toBeDefined()
  })
})
