import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DirectoryFlow } from '../src/client/DirectoryFlow.js'

afterEach(cleanup)

describe('DirectoryFlow', () => {
  it('renders a path input on remote connections and reports the picked path', () => {
    const onPicked = vi.fn()
    const onCancel = vi.fn()
    render(
      <DirectoryFlow
        open
        busy={false}
        onPicked={onPicked}
        onCancel={onCancel}
        onError={vi.fn()}
        isRemote
        pickLocal={vi.fn(async () => null)}
        language="zh-CN"
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('C:\\my-project'), {
      target: { value: 'C:\\work\\demo' },
    })
    fireEvent.click(screen.getByRole('button', { name: '打开工作区' }))

    expect(onPicked).toHaveBeenCalledWith('C:\\work\\demo')
    expect(onCancel).not.toHaveBeenCalled()
  })
})
