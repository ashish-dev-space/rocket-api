import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VariableAwareUrlInput } from '@/components/request-builder/VariableAwareUrlInput'

describe('VariableAwareUrlInput', () => {
  const baseProps = {
    onChange: vi.fn(),
    activeEnvironment: null,
    collectionVariables: [],
    onSaveVariable: vi.fn().mockResolvedValue(undefined),
    onImportCurl: vi.fn(),
  }

  it('highlights path tokens like :token in the URL input overlay', () => {
    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v3/network_invitations/:token/resend"
      />
    )

    const token = screen.getByText(':token')
    expect(token.className).toContain('border')
  })

  it('highlights query tokens like :status in the URL input overlay', () => {
    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v3/network_invitations/:token/resend?status=:status"
      />
    )

    const queryToken = screen.getByText(':status')
    expect(queryToken.className).toContain('border')
  })

  it('shows resolved styling for path/query tokens when values exist', () => {
    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v3/network_invitations/:token/resend?status=:status"
        pathParams={[{ key: 'token', value: 'abc', enabled: true }]}
        queryParams={[{ key: 'status', value: 'queued', enabled: true }]}
      />
    )

    expect(screen.getByText(':token').className).toContain('amber')
    expect(screen.getByText(':status').className).toContain('amber')
  })

  it('keeps existing {{...}} variable highlight behavior', () => {
    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v1/resource"
      />
    )

    const envToken = screen.getByText('{{BASE_URL}}')
    expect(envToken.className).toContain('border')
    expect(envToken.className).toContain('destructive')
  })

  it('opens popup and saves path token value on hover/focus flow', async () => {
    const onSaveParamToken = vi.fn().mockResolvedValue(undefined)

    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v3/network_invitations/:token/resend"
        pathParams={[{ key: 'token', value: 'old', enabled: true }]}
        onSaveParamToken={onSaveParamToken}
      />
    )

    const token = screen.getByText(':token')
    fireEvent.focus(token)

    const input = await screen.findByPlaceholderText('Parameter value')
    fireEvent.change(input, { target: { value: 'new-token' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(onSaveParamToken).toHaveBeenCalledWith('token', 'new-token', 'path')
    )
  })

  it('closes popup on outside click without saving unsaved edits', async () => {
    const onSaveParamToken = vi.fn().mockResolvedValue(undefined)

    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v3/network_invitations/:token/resend"
        pathParams={[{ key: 'token', value: 'old', enabled: true }]}
        onSaveParamToken={onSaveParamToken}
      />
    )

    const token = screen.getByText(':token')
    fireEvent.focus(token)

    const input = await screen.findByPlaceholderText('Parameter value')
    fireEvent.change(input, { target: { value: 'new-token' } })
    fireEvent.pointerDown(document.body)

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Parameter value')).not.toBeInTheDocument()
    )
    expect(onSaveParamToken).not.toHaveBeenCalled()
  })

  it('closes popup on Escape without saving unsaved edits', async () => {
    const onSaveParamToken = vi.fn().mockResolvedValue(undefined)

    render(
      <VariableAwareUrlInput
        {...baseProps}
        value="{{BASE_URL}}/api/v3/network_invitations/:token/resend"
        pathParams={[{ key: 'token', value: 'old', enabled: true }]}
        onSaveParamToken={onSaveParamToken}
      />
    )

    const token = screen.getByText(':token')
    fireEvent.focus(token)

    const input = await screen.findByPlaceholderText('Parameter value')
    fireEvent.change(input, { target: { value: 'new-token' } })
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Parameter value')).not.toBeInTheDocument()
    )
    expect(onSaveParamToken).not.toHaveBeenCalled()
  })

  it('detects curl paste and routes it to import flow', () => {
    const onImportCurl = vi.fn()

    render(
      <VariableAwareUrlInput
        {...baseProps}
        value=""
        onImportCurl={onImportCurl}
      />
    )

    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: {
        getData: () => "curl --request POST 'https://api.example.com/users'",
      },
    })

    expect(onImportCurl).toHaveBeenCalledWith(
      "curl --request POST 'https://api.example.com/users'"
    )
    expect(baseProps.onChange).not.toHaveBeenCalled()
  })

  it('does not treat a normal URL paste as curl import', () => {
    const onImportCurl = vi.fn()

    render(
      <VariableAwareUrlInput
        {...baseProps}
        value=""
        onImportCurl={onImportCurl}
      />
    )

    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: {
        getData: () => 'https://api.example.com/users',
      },
    })

    expect(onImportCurl).not.toHaveBeenCalled()
  })
})
